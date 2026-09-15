package kr.or.oti.mafiagame.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.oti.mafiagame.domain.Room;
import kr.or.oti.mafiagame.domain.RoomList;

@Mapper
public interface RoomMapper {
    List<RoomList> findAll();

    RoomList findById(@Param("roomId") long roomId);

    List<String> findMemberNames(@Param("roomId") long roomId);

    int insert(Room room);

    int insertMember(@Param("roomId") long roomId, @Param("userId") long userId);
}
